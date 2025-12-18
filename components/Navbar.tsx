import Image from "next/image";
import logo from "@/images/logo.png";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";


export default async function Navbar() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    let isLoggedIn = false;

    if (sessionId) {
        const session = await getSession(sessionId);
        isLoggedIn = !!session;
    }

    return (
        <nav className="navbar">
            <Link href="/" className="nav-brand">
                <div className="nav-logo-wrap">
                    <Image src={logo} alt="logo" fill className="nav-logo" />
                </div>
                <h1 className="nav-title">SUMMIT</h1>
            </Link>

            <div className="nav-links">
                {!isLoggedIn ? (
                    <>
                        <button>
                            <Link href="/admin/signup">Sign Up</Link>
                        </button>
                        <button>
                            <Link href="/login">Login</Link>
                        </button>
                    </>
                ) : (
                    <>
                        <button>
                            <Link href="/dashboard">Dashbaord</Link>
                        </button>
                        <form action="/logout/api" method="POST">
                            <button type="submit">Log Out</button>
                        </form>
                    </>
                )}
            </div>
        </nav>
    );
}
