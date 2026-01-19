"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout(e: React.FormEvent) {
        e.preventDefault();

        await fetch("/api/logout", {
            method: "POST",
        });

        window.location.assign("/");
    }

    return (
        <form onSubmit={handleLogout}>
            <button type="submit" className="btn">
                Log Out
            </button>
        </form>
    );
}
