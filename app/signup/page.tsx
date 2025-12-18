import Link from "next/link";

export default function Signup() {
    return (
        <>
        <button><Link href="/admin/signup">Sign Up As Admin</Link></button>
        <button><Link href="/student/signup">Sign Up As Student</Link></button>
        </>
    );
}
