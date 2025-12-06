import Image from "next/image";
import logo from "@/images/logo.png";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link href="/" className="nav-brand">
                <div className="nav-logo-wrap">
                    <Image
                    src={logo}
                    alt="logo"
                    fill
                    className="nav-logo"
                    />
                </div>
                <h1 className="nav-title">
                    SUMMIT
                </h1>
            </Link>
            
            <div className="nav-links">
                <button><Link href="/dbtesting">DB Testing For Yuhang</Link></button>
                <button><Link href="/signup">Sign Up</Link></button>
                <button><Link href="/login">Login</Link></button>
            </div>
        </nav>


    )
}