export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 760, width: "100%", background: "white", border: "1px solid #e5e9f0", borderRadius: 20, padding: 40, boxShadow: "0 10px 30px rgba(16,24,40,.06)" }}>
        <p style={{ color: "#3157d5", fontWeight: 800, marginTop: 0 }}>SCHOOL MANAGEMENT CONIK</p>
        <h1 style={{ fontSize: 42, margin: "10px 0" }}>La fondation est en place.</h1>
        <p style={{ color: "#667085", fontSize: 18, lineHeight: 1.6 }}>
          Plateforme SaaS de gestion scolaire et universitaire. Cette première page confirme que l'application web est prête à recevoir l'authentification, le dashboard et les modules métier.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          {['Supabase', 'PostgreSQL', 'Next.js', 'TypeScript', 'Multi-tenant'].map((item) => (
            <span key={item} style={{ background: "#eef2ff", color: "#3157d5", borderRadius: 999, padding: "8px 13px", fontSize: 13, fontWeight: 700 }}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
