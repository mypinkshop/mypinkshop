export async function onRequest() {
  return new Response('Hello from Functions!', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
