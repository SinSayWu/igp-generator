import Link from "next/link";

export default function Signup() {
    return (
        <>
        <Link href="/admin/signup" className="btn">Sign Up As Admin</Link>
        <Link href="/student/signup" className="btn">Sign Up As Student</Link>
        </>
    );
}
