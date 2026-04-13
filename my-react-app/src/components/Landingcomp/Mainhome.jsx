import React from 'react'
import styles from './Landing.module.css'
import B2B from '../../img/B2B.png'
function Mainhome() {
  return (

    <div className={styles.homeContainer}>
        <div className={styles.homePlatform}>
            <h6>PHARMA PLATFORM</h6>
            <h1 className={styles.firstLine}>Smarter Suply Chain</h1>
            <h1 className={styles.secondLine}>for Pharmacies</h1>
            <p>One platform connecting pharmacies with pharmaceutical<br></br>
                companies — order smarter, stock better, grow faste.
            </p>
        </div>
        <div className={styles.homeImage}>
            <img src={B2B} alt="awdasdad" />
            <h6>Built for B2B</h6>
            <p>No more calls. No more delays.<br/>
            Just seamless pharma trade.</p>
        </div>
    </div>
  )
}

export default Mainhome