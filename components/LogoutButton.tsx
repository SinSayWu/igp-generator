export default function LogoutButton() {
    return (
        <form action="/api/logout" method="post">
            <button type="submit" className="btn">
                Log Out
            </button>
        </form>
    );
}
