import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { password } = await req.json();

    const sitePassword = process.env.SITE_PASSWORD;

    if (!sitePassword) {
        console.error('SITE_PASSWORD not set in environment variables');
        return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (password === sitePassword) {
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'パスワードが違います' }, { status: 401 });
}
