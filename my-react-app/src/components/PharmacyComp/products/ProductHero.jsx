import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiShoppingCart, FiTruck, FiShield, FiPackage } from 'react-icons/fi';
import styles from '../styles/PharmaBridge.module.css';

const API_CARTS = 'http://localhost:3000/api/carts';

// الخيارات تُبنى ديناميكياً من بيانات المنتج

export default function ProductHero({ product }) {
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    // 'single' = طلب بالحبة | 'package' = طلب بالكرتونة/العلبة
    const [unitType, setUnitType] = useState('single');
    const [loading, setLoading] = useState(false);

    const unitsPerPackage = parseInt(product.units_per_package) || 1;
    const packageLabel = product.unit_type || 'Unit';
    const hasPackageOption = unitsPerPackage > 1;
    const [toast, setToast] = useState(null);
    const [timeLeftStr, setTimeLeftStr] = useState('');

    useEffect(() => {
        if (!product.discount_percentage || product.discount_percentage <= 0) return;

        let endDate;
        if (product.promotion_end_date) {
            endDate = new Date(product.promotion_end_date).getTime();
        } else {
            const now = new Date();
            const anchor = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const days = (product.id % 20) + 15;
            const hours = (product.id * 13) % 24;
            endDate = anchor + (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000);
            if (endDate < Date.now()) {
                endDate += 30 * 24 * 60 * 60 * 1000;
            }
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = endDate - now;
            if (diff <= 0) {
                setTimeLeftStr('Expired');
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeftStr(`${d}d ${h}h ${m}m ${s}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [product]);

    const discountedPrice = product.discount_percentage > 0
        ? (parseFloat(product.price) * (1 - product.discount_percentage / 100)).toFixed(2)
        : null;

    const finalPrice = discountedPrice || parseFloat(product.price).toFixed(2);

    const isPackageMode = unitType === 'package' && hasPackageOption;
    const PACKAGE_DISCOUNT = 0.08; // 8% خصم عند الشراء بالكرتونة

    const packageUnitPrice = isPackageMode
        ? (parseFloat(finalPrice) * (1 - PACKAGE_DISCOUNT)).toFixed(2)
        : null;
    const effectiveUnitPrice = packageUnitPrice || finalPrice;
    // في وضع الكرتون: quantity = عدد الكراتين، effectiveQty = إجمالي الحبات
    const effectiveQty = isPackageMode ? quantity * unitsPerPackage : quantity;
    const pricePerPackage = isPackageMode
        ? (parseFloat(packageUnitPrice) * unitsPerPackage).toFixed(2)
        : null;
    const subtotal = isPackageMode
        ? (quantity * parseFloat(pricePerPackage)).toFixed(2)
        : (parseFloat(effectiveUnitPrice) * quantity).toFixed(2);

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // الحد الأقصى: لو وضع كرتون = عدد الكراتين في المخزون، لو حبة = عدد الحبات
    const totalUnits = product.stock_quantity * unitsPerPackage;
    const maxQty = isPackageMode ? product.stock_quantity : totalUnits;
    const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
    const increaseQty = () => setQuantity(q => Math.min(maxQty, q + 1));

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            const cartsRes = await fetch(API_CARTS, { headers });
            let cartId = null;

            if (cartsRes.ok) {
                const carts = await cartsRes.json();
                const activeCart = carts.find(c => c.status === 'active');
                if (activeCart) cartId = activeCart.id;
            }

            if (!cartId) {
                const createRes = await fetch(API_CARTS, { method: 'POST', headers });
                if (!createRes.ok) {
                    const err = await createRes.json();
                    showToast(err.message || 'Failed to create cart', 'error');
                    return;
                }
                const data = await createRes.json();
                cartId = data.cartId;
            }

            const addRes = await fetch(`${API_CARTS}/${cartId}/items`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ product_id: product.id, quantity: effectiveQty })
            });

            const result = await addRes.json();
            if (addRes.ok) {
                const label = isPackageMode
                    ? `${quantity} ${packageLabel}${quantity > 1 ? 's' : ''}`
                    : `×${effectiveQty}`;
                showToast(`${product.name} (${label}) added to cart!`);
            } else {
                showToast(result.message || 'Failed to add to cart', 'error');
            }
        } catch (err) {
            showToast('Network error. Please check the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.heroSection}>

            {/* Image Section */}
            <div className={styles.imageGallery}>
                <div className={styles.mainImage} style={{ position: 'relative' }}>
                    {product.images?.length > 0 ? (
                        <img
                            src={`http://localhost:3000/uploads/products/${product.images[0]}`}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                        />
                    ) : (
                        <div className={styles.imagePlaceholder}>
                            <span style={{ fontSize: '5rem' }}>💊</span>
                        </div>
                    )}
                    {discountedPrice && timeLeftStr && timeLeftStr !== 'Expired' && (
                        <div style={{
                            position: 'absolute', bottom: '15px', right: '15px',
                            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                            padding: '6px 12px', borderRadius: '20px',
                            fontSize: '0.85rem', fontWeight: '700', color: '#e67e22',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                            ⏱️ {timeLeftStr}
                        </div>
                    )}
                </div>
                <div className={styles.thumbnails}>
                    <div className={`${styles.thumbPlaceholder} ${styles.activeThumb}`}></div>
                    <div className={styles.thumbPlaceholder}></div>
                    <div className={styles.thumbPlaceholder}></div>
                    <div className={styles.thumbPlaceholder}></div>
                </div>
            </div>

            {/* Info Section */}
            <div className={styles.productInfo}>
                <span className={styles.categoryChip}>💊 {product.category?.toUpperCase() || 'GENERAL'}</span>
                <h1 className={styles.title}>{product.name}</h1>

                <div className={styles.meta}>
                    <span className={styles.manufacturer}>
                        {product.manufacturer || 'Unknown Manufacturer'} <FiCheckCircle className={styles.verified} />
                    </span>
                    <span className={styles.sku}>SKU: PB-{product.id}-CAT</span>
                </div>

                <div className={styles.pricing}>
                    <span className={styles.currentPrice}>${finalPrice}</span>
                    {discountedPrice && (
                        <>
                            <span className={styles.oldPrice}>${parseFloat(product.price).toFixed(2)}</span>
                            <span className={styles.discountBadge}>{product.discount_percentage}% OFF</span>
                        </>
                    )}
                </div>

                <p className={styles.b2bNote}>
                    {product.description || 'Exclusive B2B clinical pricing available for orders exceeding 50 units.'}
                </p>

                <div className={styles.orderSection}>
                    <label className={styles.qtyLabel}>ORDER QUANTITY</label>

                    {/* Stock badge */}
                    <div style={{ marginBottom: '10px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '1rem', fontWeight: 800, color: '#065f46',
                            background: '#d1fae5', border: '2px solid #6ee7b7',
                            borderRadius: '10px', padding: '7px 16px',
                        }}>
                            📦 In Stock:{' '}
                            <strong>{product.stock_quantity.toLocaleString()}</strong>{' '}
                            {packageLabel}{product.stock_quantity !== 1 ? 's' : ''}
                            {unitsPerPackage > 1 && (
                                <span style={{ fontWeight: 600, color: '#047857', fontSize: '0.85rem' }}>
                                    ({totalUnits.toLocaleString()} units total)
                                </span>
                            )}
                        </span>
                    </div>

                    {/* Unit mode selector */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <button
                            type="button"
                            onClick={() => { setUnitType('single'); setQuantity(1); }}
                            style={{
                                padding: '7px 16px', borderRadius: '20px',
                                border: `2px solid ${unitType === 'single' ? '#013223' : '#d1d5db'}`,
                                background: unitType === 'single' ? '#013223' : '#f9fafb',
                                color: unitType === 'single' ? '#fff' : '#374151',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            💊 Per Unit
                        </button>

                        {hasPackageOption && (
                            <button
                                type="button"
                                onClick={() => { setUnitType('package'); setQuantity(1); }}
                                style={{
                                    padding: '7px 16px', borderRadius: '20px',
                                    border: `2px solid ${isPackageMode ? '#b45309' : '#fcd34d'}`,
                                    background: isPackageMode ? '#92400e' : '#fef3c7',
                                    color: isPackageMode ? '#fff' : '#78350f',
                                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                }}
                            >
                                📦 Per {packageLabel} ({unitsPerPackage} units)
                                <span style={{
                                    background: isPackageMode ? 'rgba(255,255,255,0.25)' : '#fcd34d',
                                    color: isPackageMode ? '#fff' : '#78350f',
                                    borderRadius: '10px', padding: '1px 6px',
                                    fontSize: '0.7rem', fontWeight: 800,
                                }}>
                                    -8%
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Quantity stepper */}
                    <div className={styles.qtyControls}>
                        <div className={styles.qtyInputGroup}>
                            <button onClick={decreaseQty} disabled={quantity <= 1}
                                style={{ cursor: quantity <= 1 ? 'not-allowed' : 'pointer' }}>−</button>
                            <input
                                type="text"
                                value={isPackageMode
                                    ? `${quantity} ${packageLabel}${quantity > 1 ? 's' : ''}`
                                    : quantity}
                                readOnly
                                style={{ minWidth: isPackageMode ? '110px' : '48px' }}
                            />
                            <button onClick={increaseQty} disabled={quantity >= maxQty}
                                style={{ cursor: quantity >= maxQty ? 'not-allowed' : 'pointer' }}>+</button>
                        </div>
                        {isPackageMode
                            ? <span style={{ fontSize: '0.82rem', color: '#78350f', fontWeight: 600 }}>
                                {effectiveQty} units total · ${pricePerPackage}/{packageLabel.toLowerCase()}
                              </span>
                            : <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>per unit · ${finalPrice}/unit</span>
                        }
                    </div>

                    {/* Package info bar */}
                    {isPackageMode && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                            background: '#fef9c3', border: '1.5px solid #fcd34d',
                            borderRadius: '10px', padding: '10px 14px', marginBottom: '4px',
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 600 }}>QUANTITY</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
                                    {quantity} {packageLabel}{quantity > 1 ? 's' : ''} / {effectiveQty} units
                                </div>
                            </div>
                            <div style={{ borderLeft: '1.5px solid #fcd34d', height: '36px' }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 600 }}>UNIT PRICE</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
                                    ${packageUnitPrice}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#a16207', marginLeft: '4px', textDecoration: 'line-through' }}>${finalPrice}</span>
                                </div>
                            </div>
                            <div style={{ borderLeft: '1.5px solid #fcd34d', height: '36px' }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 600 }}>SAVINGS</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d' }}>
                                    ${((parseFloat(finalPrice) - parseFloat(packageUnitPrice)) * effectiveQty).toFixed(2)} saved
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subtotal */}
                    <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '10px 0 14px' }}>
                        {isPackageMode
                            ? `Subtotal (${quantity} ${packageLabel.toLowerCase()}${quantity > 1 ? 's' : ''} / ${effectiveQty} units):`
                            : `Subtotal (${quantity} units):`
                        }&nbsp;
                        <strong style={{ color: '#0b2e20', fontSize: '1.05rem' }}>${subtotal}</strong>
                        {isPackageMode && (
                            <span style={{ marginLeft: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.82rem' }}>
                                (8% package discount applied)
                            </span>
                        )}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            className={styles.addToCartBtn}
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity <= 0 || loading || (isPackageMode ? quantity > product.stock_quantity : effectiveQty > totalUnits)}
                        >
                            <FiShoppingCart />
                            {loading ? 'Adding...' : product.stock_quantity <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
                        </button>

                        <button
                            onClick={() => navigate('/pharmacy-dashboard', { state: { tab: 'cart' } })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 20px', borderRadius: '8px',
                                border: '2px solid #0b2e20', background: 'transparent',
                                color: '#0b2e20', fontWeight: 700, cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <FiPackage /> GO TO CART
                        </button>
                    </div>
                </div>

                <div className={styles.trustBadges}>
                    <div className={styles.trustBadge}><FiTruck /> FAST DELIVERY</div>
                    <div className={styles.trustBadge}><FiShield /> QUALITY ASSURED</div>
                </div>
            </div>

            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: toast.type === 'error' ? '#dc2626' : '#0b2e20',
                    color: '#fff', padding: '12px 20px', borderRadius: '10px',
                    fontWeight: 600, fontSize: '0.9rem', zIndex: 9999,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
