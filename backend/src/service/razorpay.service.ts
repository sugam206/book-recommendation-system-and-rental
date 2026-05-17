import crypto from 'crypto';

const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1';

const resolveEnv = (...keys: string[]) => {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) {
            return value;
        }
    }
    return '';
};

export const getRazorpayConfig = () => {
    const keyId = resolveEnv('Razorpay_API_KEY', 'RAZORPAY_API_KEY', 'RAZORPAY_KEY_ID');
    const keySecret = resolveEnv('Razorpay_API_SECRET', 'RAZORPAY_API_SECRET', 'RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are missing in backend/.env');
    }

    return { keyId, keySecret };
};

type RazorpayOrderRequest = {
    amount: number;
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
};

type RazorpayOrderResponse = {
    id: string;
    entity: 'order';
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
};

export const createRazorpayOrder = async ({
    amount,
    currency = 'INR',
    receipt,
    notes
}: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
    const { keyId, keySecret } = getRazorpayConfig();

    const response = await fetch(`${RAZORPAY_API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
        },
        body: JSON.stringify({
            amount,
            currency,
            receipt,
            notes
        })
    });

    const payload = await response.json();
    if (!response.ok) {
        const message = payload?.error?.description || payload?.error?.reason || 'Failed to create Razorpay order';
        throw new Error(message);
    }

    return payload as RazorpayOrderResponse;
};

export const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    signature
}: {
    orderId: string;
    paymentId: string;
    signature: string;
}) => {
    const { keySecret } = getRazorpayConfig();
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return expectedSignature === signature;
};
