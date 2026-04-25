async function test() {
  const result = await fetch('http://127.0.0.1:3000/api/settings');
  console.log(result.status);
  console.log(await result.text());
}
test();
