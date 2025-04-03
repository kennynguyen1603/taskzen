import type { NextApiRequest, NextApiResponse } from 'next'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const { token } = req.body

        // Log để debug
        console.log('Received Google token:', token.substring(0, 20) + '...');

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()

        // Log payload
        console.log('Google auth payload:', {
            email: payload?.email,
            name: payload?.name,
            picture: payload?.picture,
            // Không log toàn bộ payload vì có thể chứa thông tin nhạy cảm
        });

        if (!payload) {
            console.error('Empty payload from Google');
            return res.status(400).json({ message: 'Invalid token' })
        }

        // Tạo JWT token để sử dụng trong ứng dụng
        const appToken = jwt.sign(
            {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                sub: payload.sub
            },
            process.env.JWT_SECRET || 'your-fallback-secret',
            { expiresIn: '7d' }
        )

        // Log token đã tạo (chỉ phần đầu)
        console.log('Created app token:', appToken.substring(0, 20) + '...');

        // Lưu token vào cookie secure và httpOnly
        res.setHeader(
            'Set-Cookie',
            `access_token=${appToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
        );

        return res.status(200).json({
            success: true,
            token: appToken,
            user: {
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            }
        })
    } catch (error) {
        console.error('Google auth error:', error);
        return res.status(500).json({ message: 'Authentication failed', error: String(error) })
    }
} 