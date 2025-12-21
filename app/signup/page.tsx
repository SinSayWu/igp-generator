import Link from "next/link";

export default function Signup() {
    return (
        /* Use the hyphenated name from your CSS */
        <div className="nav-padding login-container"> 
            <Link href="/admin/signup" className="btn"> Sign Up As Admin</Link>
            <Link href="/student/signup" className="btn">Sign Up As Student</Link>
        </div>
    );
}