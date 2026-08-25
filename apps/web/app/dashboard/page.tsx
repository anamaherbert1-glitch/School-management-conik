export default function DashboardPage() {
  const stats = [
    ['Étudiants', '0'],
    ['Enseignants', '0'],
    ['Filières', '0'],
    ['Paiements du mois', '0 FCFA'],
  ];

  return (
    <main style={{minHeight:'100vh',background:'#f7f8fb',fontFamily:'Inter,system-ui,sans-serif',padding:'32px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,marginBottom:32}}>
        <div><p style={{margin:0,fontSize:12,fontWeight:800,letterSpacing:'.1em',color:'#64748b'}}>SCHOOL MANAGEMENT CONIK</p><h1 style={{margin:'6px 0 0',fontSize:32,color:'#0f172a'}}>Tableau de bord</h1></div>
        <a href="/login" style={{color:'#334155',textDecoration:'none'}}>Se déconnecter</a>
      </header>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16}}>
        {stats.map(([label,value]) => <article key={label} style={{background:'#fff',border:'1px solid #e7eaf0',borderRadius:18,padding:22}}><p style={{margin:0,color:'#64748b',fontSize:13}}>{label}</p><strong style={{display:'block',marginTop:10,fontSize:26,color:'#0f172a'}}>{value}</strong></article>)}
      </section>
      <section style={{marginTop:24,background:'#fff',border:'1px solid #e7eaf0',borderRadius:18,padding:24}}><h2 style={{marginTop:0,color:'#0f172a'}}>Bienvenue dans l'administration</h2><p style={{color:'#64748b'}}>Les modules seront activés progressivement et alimentés par les données réelles de l'établissement.</p></section>
    </main>
  );
}
