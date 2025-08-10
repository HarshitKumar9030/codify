export async function GET() {
  const base = process.env.EXECUTION_SERVER_URL || 'http://127.0.0.1:8080';
  try {
    const res = await fetch(`${base}/api/ping`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({ success: false }));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ success: false, error: 'Ping proxy failed' }, { status: 502 });
  }
}
