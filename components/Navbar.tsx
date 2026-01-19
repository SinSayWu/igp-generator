import Image from "next/image";
import logo from "@/images/logo.png";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import LogoutButton from "./LogoutButton";
import { unstable_noStore as noStore } from "next/cache";

export default async function Navbar() {
    noStore();
    
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    let isLoggedIn = false;

    if (sessionId) {
        const session = await getSession(sessionId);
        isLoggedIn = !!session;
    }

    return (
        <nav className="navbar print:bg-transparent print:border-none">
            <Link href="/" className="nav-brand">
                <div className="nav-logo-wrap">
                    <Image src={logo} alt="logo" fill className="nav-logo" />
                </div>
                <h1 className="nav-title">SUMMIT</h1>
            </Link>

            <div className="nav-links print:hidden">
                {!isLoggedIn ? (
                    <>
                        <Link href="/signup" className="btn">Sign Up</Link>
                        <Link href="/login" className="btn">Login</Link>
                    </>
                ) : (
                    <>
                        <Link href="/dashboard" className="btn">Dashboard</Link>
                        <Link href="/profile" className="btn">Profile</Link>
                        <LogoutButton />
                    </>
                )}
            </div>
        </nav>
    );
}
