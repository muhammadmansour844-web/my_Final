import styles from './Landing.module.css'
import { Link } from 'react-router-dom'
import logo from '../../img/pharmp.png'

function Landingheader() {
 
  return (
    <nav className={styles.header}>
      <img src={logo} alt="pharmlogo" />
      <h1>PharmaPridge</h1>
      <Link to="/login" className={styles.loginPage}>Login</Link>
    </nav>
  )
}

export default Landingheader