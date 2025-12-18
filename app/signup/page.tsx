export default function Signup() {
        return (
        <div className ="nav-padding">
            <div className="login-container">
                <p className="pop-text">Begin your ascension today</p>
                <input className="signup-inputs" placeholder="Username" type="text"></input>
                <div className="name-row">
                <input className="half-input" placeholder="First Name" type="password"></input> 
                <input className="half-input" placeholder="Last Name" type="password"></input>
                </div>
                <input className="signup-inputs" placeholder="Password" type="password"></input>
                <input className="signup-inputs" placeholder="Confirm Password" type="password"></input>
                <button className="button">Sign Up</button>
            </div>
        </div>
    )
}