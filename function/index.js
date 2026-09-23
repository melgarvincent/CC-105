const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    initializeApp
} = require("firebase-admin/app");

const {
    getDatabase
} = require("firebase-admin/database");

const {
    getAuth
} = require("firebase-admin/auth");

const crypto =
    require("crypto");

const nodemailer =
    require("nodemailer");


/* =========================================================
   FIREBASE ADMIN
========================================================= */

initializeApp();


const db =
    getDatabase();


const adminAuth =
    getAuth();


/* =========================================================
   OTP SETTINGS
========================================================= */

const OTP_EXPIRATION =
    5 * 60 * 1000;


const RESEND_COOLDOWN =
    60 * 1000;


const MAX_ATTEMPTS =
    5;


/* =========================================================
   OTP REFERENCE
========================================================= */

function otpRef(uid) {

    return db.ref(
        `otpChallenges/${uid}`
    );

}


/* =========================================================
   GENERATE OTP
========================================================= */

function generateOtp() {

    return String(
        crypto.randomInt(
            100000,
            1000000
        )
    );

}


/* =========================================================
   HASH OTP
========================================================= */

function hashOtp(otp) {

    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

}


/* =========================================================
   CHECK AUTH
========================================================= */

function requireAuth(request) {

    if (!request.auth) {

        throw new HttpsError(
            "unauthenticated",
            "You must be logged in."
        );

    }

    return request.auth.uid;

}


/* =========================================================
   GMAIL TRANSPORTER
========================================================= */

const transporter =
    nodemailer.createTransport({

        service: "gmail",

        auth: {

            user:
                process.env.MAIL_USER,

            pass:
                process.env.MAIL_PASS

        }

    });


/* =========================================================
   SEND OTP
========================================================= */

exports.sendOtp =
    onCall(
        {
            region: "us-central1"
        },

        async (request) => {

            const uid =
                requireAuth(request);


            const user =
                await adminAuth.getUser(
                    uid
                );


            if (!user.email) {

                throw new HttpsError(
                    "failed-precondition",
                    "Your account does not have an email address."
                );

            }


            const challengeRef =
                otpRef(uid);


            const existingSnapshot =
                await challengeRef.get();


            const now =
                Date.now();


            if (
                existingSnapshot.exists()
            ) {

                const existing =
                    existingSnapshot.val();


                if (
                    existing.resendAvailableAt &&
                    now <
                    Number(
                        existing.resendAvailableAt
                    )
                ) {

                    const remaining =
                        Math.ceil(
                            (
                                Number(
                                    existing.resendAvailableAt
                                ) - now
                            ) / 1000
                        );


                    throw new HttpsError(
                        "resource-exhausted",
                        `Please wait ${remaining} seconds before requesting another OTP.`
                    );

                }

            }


            const otp =
                generateOtp();


            const otpHash =
                hashOtp(otp);


            const challenge = {

                otpHash:

                    otpHash,

                expiresAt:

                    now +
                    OTP_EXPIRATION,

                resendAvailableAt:

                    now +
                    RESEND_COOLDOWN,

                attempts: 0

            };


            /*
             * Store hashed OTP.
             * We do NOT store the real OTP.
             */

            await challengeRef.set(
                challenge
            );


            /*
             * Force OTP verification to false
             * every time a new OTP is issued.
             */

            const currentClaims =
                user.customClaims || {};


            await adminAuth
                .setCustomUserClaims(
                    uid,
                    {
                        ...currentClaims,
                        otpVerified: false
                    }
                );


            /*
             * Send OTP to user's Gmail.
             */

            await transporter.sendMail({

                from:
                    `Arbee's Bakery Shop <${process.env.MAIL_USER}>`,

                to:
                    user.email,

                subject:
                    "Arbee's Bakery Shop - Login Verification Code",

                text:
                    `Your Arbee's Bakery Shop verification code is ${otp}. This code expires in 5 minutes.`,

                html: `

                    <div style="
                        font-family:Arial,sans-serif;
                        max-width:500px;
                        margin:auto;
                        padding:25px;
                        border:1px solid #ead8ca;
                        border-radius:15px;
                        background:#fff7f0;
                    ">

                        <h2 style="
                            color:#8b4513;
                            text-align:center;
                        ">
                            ARBEES BAKERY SHOP
                        </h2>

                        <p>
                            Hello!
                        </p>

                        <p>
                            Use the verification code below
                            to complete your login:
                        </p>

                        <div style="
                            font-size:32px;
                            font-weight:bold;
                            letter-spacing:8px;
                            text-align:center;
                            padding:20px;
                            margin:20px 0;
                            background:white;
                            border-radius:10px;
                            color:#8b4513;
                        ">
                            ${otp}
                        </div>

                        <p>
                            This code will expire in
                            <strong>5 minutes</strong>.
                        </p>

                        <p style="
                            color:#777;
                            font-size:12px;
                        ">
                            If you did not attempt to login,
                            you can ignore this email.
                        </p>

                    </div>

                `

            });


            return {

                success: true,

                email:
                    user.email,

                expiresInSeconds:
                    300,

                resendInSeconds:
                    60

            };

        }
    );


/* =========================================================
   VERIFY OTP
========================================================= */

exports.verifyOtp =
    onCall(
        {
            region: "us-central1"
        },

        async (request) => {

            const uid =
                requireAuth(request);


            const otp =
                String(
                    request.data?.otp || ""
                ).trim();


            if (
                !/^\d{6}$/.test(otp)
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "OTP must contain exactly 6 digits."
                );

            }


            const challengeRef =
                otpRef(uid);


            const snapshot =
                await challengeRef.get();


            if (!snapshot.exists()) {

                throw new HttpsError(
                    "invalid-argument",
                    "OTP not found. Please request a new OTP."
                );

            }


            const challenge =
                snapshot.val();


            const now =
                Date.now();


            /*
             * Expired
             */

            if (
                now >
                Number(
                    challenge.expiresAt
                )
            ) {

                await challengeRef.remove();


                throw new HttpsError(
                    "invalid-argument",
                    "OTP expired. Please request a new OTP."
                );

            }


            /*
             * Too many attempts
             */

            const attempts =
                Number(
                    challenge.attempts || 0
                );


            if (
                attempts >=
                MAX_ATTEMPTS
            ) {

                await challengeRef.remove();


                throw new HttpsError(
                    "resource-exhausted",
                    "Too many incorrect attempts. Please request a new OTP."
                );

            }


            const submittedHash =
                hashOtp(otp);


            const storedHash =
                String(
                    challenge.otpHash
                );


            const hashesMatch =
                crypto.timingSafeEqual(
                    Buffer.from(
                        submittedHash
                    ),
                    Buffer.from(
                        storedHash
                    )
                );


            /*
             * WRONG OTP
             */

            if (!hashesMatch) {

                await challengeRef.update({

                    attempts:
                        attempts + 1

                });


                const remaining =
                    MAX_ATTEMPTS -
                    (
                        attempts + 1
                    );


                throw new HttpsError(
                    "invalid-argument",
                    `Incorrect OTP. ${remaining} attempt(s) remaining.`
                );

            }


            /*
             * CORRECT OTP
             */

            const user =
                await adminAuth.getUser(
                    uid
                );


            const currentClaims =
                user.customClaims || {};


            await adminAuth
                .setCustomUserClaims(
                    uid,
                    {
                        ...currentClaims,
                        otpVerified: true
                    }
                );


            /*
             * OTP can no longer be reused.
             */

            await challengeRef.remove();


            return {

                success: true,

                message:
                    "OTP verified successfully."

            };

        }
    );


/* =========================================================
   CLEAR OTP VERIFICATION
========================================================= */

exports.clearOtpVerification =
    onCall(
        {
            region: "us-central1"
        },

        async (request) => {

            const uid =
                requireAuth(request);


            const user =
                await adminAuth.getUser(
                    uid
                );


            const currentClaims =
                user.customClaims || {};


            await adminAuth
                .setCustomUserClaims(
                    uid,
                    {
                        ...currentClaims,
                        otpVerified: false
                    }
                );


            await otpRef(uid).remove();


            return {

                success: true

            };

        }
    );  
