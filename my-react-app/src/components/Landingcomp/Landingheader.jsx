import styles from './Landing.module.css'
import { Link } from 'react-router-dom'
import logo from '../../img/pharmp.png'

function Landingheader() {

  return (
    <nav className={styles.header}>
      <img src={logo} alt="pharmlogo" />
      <h1>PharmaPridge</h1>
      <div className={styles.headerActions}>
        <Link to="/register" className={styles.registerPage}>Register</Link>
        <Link to="/login" className={styles.loginPage}>Login</Link>
      </div>
    </nav>
  )
}

export default Landingheader