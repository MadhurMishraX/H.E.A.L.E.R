async function test() {
  const result3 = await fetch('http://127.0.0.1:3000/api/doesnotexist');
  console.log('404 STATUS:', result3.status);
  console.log('404 BODY:', await result3.text());
}
test();
