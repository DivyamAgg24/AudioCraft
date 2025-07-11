import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { userService } from "../services/userService";
import dotenv from "dotenv"
dotenv.config()

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.CALLBACK_URL
        },

        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log("OAuth Profile: ", profile)

                let user = await userService.findByGoogleId(profile.id);

                if (user) {
                    console.log("Existing user found: ", user.email)
                    await userService.updateLastLogin(user.id)
                    return done(null, user)
                }

                console.log("Creating new user...")
                const newUserData = {
                    googleId: profile.id,
                    email: profile.emails?.[0]?.value || '',
                    name: profile.displayName || '',
                    avatar: profile.photos?.[0]?.value
                }

                user = await userService.createUser(newUserData);
                console.log('New user created:', user.email);

                return done(null, user)
            } catch (error) {
                console.error("OAuth Error: ", error)
                return done(error, false)
            }
        }
    )
)

passport.serializeUser((user: any, done) => {
    console.log('Serializing User: ', user.id);
    done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
    try {
        console.log('Deserializing user with ID:', id);
        const user = await userService.findById(id);
        done(null, user);
    } catch (error) {
        console.error('Deserialization error:', error);
        done(error, null);
    }
});