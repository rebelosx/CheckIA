async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}
window.logout = logout;