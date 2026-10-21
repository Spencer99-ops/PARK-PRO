import React from 'react';
import { theme } from '../Theme';

// Importation des images (assure-toi que les noms correspondent à tes fichiers dans src/components)
import ParkingHero from './parking(1).jpeg'; 
import ParkingFeature from './parking(2).jpeg';

export default function LandingPage({ onConnect }) {
  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.containerFlex}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logoText}>PARK-PRO</span>
          </div>
          <nav style={styles.navLinks}>
            <a href="#roles" style={styles.navLink}>Solutions</a>
            <a href="#aide" style={styles.navLink}>Assistance</a>
            <button style={styles.loginBtn} onClick={onConnect}>
              PORTAIL GESTION
            </button>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <div style={styles.badge}>Innovation Mobilité 2026 ⚡</div>
              <h1 style={styles.title}>
                Gérez votre parking avec une <br />
                <span style={styles.gradientText}>maîtrise absolue.</span>
              </h1>
              <p style={styles.subtitle}>
                Une plateforme de supervision intelligente conçue pour maximiser l'efficacité 
                opérationnelle et sécuriser chaque transaction.
              </p>
              <div style={styles.ctaGroup}>
                <button style={styles.ctaPrimary} onClick={onConnect}>Découvrir la démo</button>
                <div style={styles.trustBatch}>Des mises à jour pourront être effectuées à tout moment</div>
              </div>
            </div>
            
            <div style={styles.heroImageContainer}>
              <div style={styles.imageCard}>
                <img src={ParkingHero} alt="Infrastructure Park-Pro" style={styles.heroImage} />
                <div style={styles.glassBadge}>
                  <div style={styles.pulseDot}></div>
                  <span>Supervision en direct : Zone B14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION RÔLES : LES 3 PROFILS (ADMIN, AGENT, CLIENT) */}
      <section id="roles" style={styles.sectionRoles}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Une interface pour chaque mission</h2>
            <p style={styles.sectionSubtitle}>Une expérience fluide pour tous les acteurs de votre infrastructure.</p>
          </div>
          <div style={styles.gridRoles}>
            <RoleCard 
              title="Administrateur" 
              icon="📈" 
              desc="Contrôle global et data."
              features={[
                "Analytics & Revenus Live",
                "Gestion des abonnements",
                "Audit des transactions (EN MAINTENANCE)",
                "Rapports comptables"
              ]} 
            />
            <RoleCard 
              title="Agent Terrain" 
              icon="🛂" 
              desc="Opérations et fluidité."
              features={[
                "Accès aux entrées/sorties",
                "Encaissement Mobile Money",
                "Impression de tickets",
                "Signalement d'incidents"
              ]} 
            />
            <RoleCard 
              title="Utilisateur" 
              icon="🚗" 
              desc="Autonomie et confort."
              features={[
                "Paiement via smartphone",
                "Historique des sessions",
                "Réservation de place",
                "Reçus dématérialisés"
              ]} 
            />
          </div>
        </div>
      </section>

      {/* SECTION TECHNIQUE */}
      <section style={styles.featureSection}>
        <div style={styles.container}>
          <div style={styles.featureGrid}>
            <div style={styles.featureImageWrapper}>
              <img src={ParkingFeature} alt="Technologie de flux" style={styles.featureImage} />
              <div style={styles.glowEffect}></div>
            </div>
            <div style={styles.featureTextContent}>
              <h2 style={styles.titleSmall}>Digitalisation des flux & Sécurité</h2>
              <p style={styles.description}>
                Réduisez la fraude et les erreurs humaines grâce à une automatisation complète. 
                De l'entrée à la sortie, chaque mouvement est tracé, horodaté et sécurisé.
              </p>
              <div style={styles.statsContainer}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>+40%</span>
                  <span style={styles.statLabel}>de rotation</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>Zero</span>
                  <span style={styles.statLabel}>Fuite de cash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & CONFIDENTIALITÉ */}
      <section id="aide" style={styles.sectionContact}>
        <div style={styles.container}>
          <div style={styles.contactWrapper}>
            <div style={styles.contactInfo}>
              <h2 style={styles.titleSmall}>Besoin d'aide ?</h2>
              <p style={{color: '#94a3b8', marginBottom: '30px'}}>Support technique disponible 24/7 pour vos équipes.</p>
              <div style={styles.socialGrid}>
                <SocialLink icon="📱" name="WhatsApp" detail="+237 699 55 33 33" color="#25D366" />
                <SocialLink icon="✉️" name="Support Email" detail="support@parkpro.cm" color="#0078D4" />
              </div>
            </div>
            <div style={styles.policyCard}>
              <h4 style={{color: theme.accent, marginBottom: '15px'}}>Confidentialité</h4>
              <p style={styles.policyText}>
                Vos données sont chiffrées (AES-256). Nous protégeons l'identité des usagers 
                et les données de paiement conformément aux normes de sécurité financière.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.container}>
          <p style={{opacity: 0.4, fontSize: '0.8rem'}}>© 2026 PARK-PRO SOLUTIONS. Design for Excellence.</p>
        </div>
      </footer>
    </div>
  );
}

// COMPOSANTS
const RoleCard = ({ title, icon, desc, features }) => (
  <div style={styles.roleCard}>
    <div style={styles.roleIcon}>{icon}</div>
    <h3 style={styles.roleTitle}>{title}</h3>
    <p style={styles.roleDesc}>{desc}</p>
    <div style={styles.roleDivider}></div>
    <ul style={styles.roleList}>
      {features.map((f, i) => (
        <li key={i} style={styles.roleItem}>
          <span style={styles.checkIcon}>•</span> {f}
        </li>
      ))}
    </ul>
  </div>
);

const SocialLink = ({ icon, name, detail, color }) => (
  <div style={styles.socialLinkCard}>
    <span style={{fontSize: '1.2rem'}}>{icon}</span>
    <div style={{textAlign: 'left'}}>
      <div style={{fontSize: '0.8rem', color: '#64748b'}}>{name}</div>
      <div style={{fontSize: '0.9rem', fontWeight: 'bold', color: '#f1f5f9'}}>{detail}</div>
    </div>
  </div>
);

// STYLES
const styles = {
  wrapper: { width: '100%', minHeight: '100vh', background: '#020617', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },
  header: { position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  containerFlex: { maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  logo: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: { background: theme.accent, color: '#000', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontWeight: '900' },
  logoText: { fontWeight: '800', letterSpacing: '1.5px', fontSize: '1.1rem' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '30px' },
  navLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' },
  loginBtn: { background: 'white', color: '#020617', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', border: 'none', cursor: 'pointer' },
  
  hero: { padding: '180px 0 100px' },
  heroContent: { display: 'flex', alignItems: 'center', gap: '80px', flexWrap: 'wrap' },
  heroText: { flex: '1.4', minWidth: '320px' },
  badge: { color: theme.accent, background: 'rgba(56, 189, 248, 0.1)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '25px', border: `1px solid ${theme.accent}30`, display: 'inline-block' },
  title: { fontSize: '4rem', fontWeight: '900', marginBottom: '30px', lineHeight: 1.1, letterSpacing: '-2px' },
  gradientText: { background: `linear-gradient(to right, ${theme.accent}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: '1.2rem', color: '#94a3b8', marginBottom: '45px', lineHeight: '1.7', maxWidth: '540px' },
  ctaGroup: { display: 'flex', alignItems: 'center', gap: '20px' },
  ctaPrimary: { background: theme.accent, color: '#000', padding: '18px 35px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer' },
  trustBatch: { fontSize: '0.8rem', color: '#475569' },

  heroImageContainer: { flex: '1', minWidth: '320px', position: 'relative' },
  imageCard: { borderRadius: '32px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' },
  heroImage: { width: '100%', height: 'auto', display: 'block' },
  glassBadge: { position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' },
  pulseDot: { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' },

  sectionRoles: { padding: '100px 0' },
  sectionHeader: { textAlign: 'center', marginBottom: '60px' },
  sectionTitle: { fontSize: '2.8rem', fontWeight: '800', marginBottom: '15px' },
  sectionSubtitle: { color: '#64748b' },
  gridRoles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
  roleCard: { background: '#0f172a', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' },
  roleIcon: { fontSize: '2.5rem', marginBottom: '15px' },
  roleTitle: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '10px' },
  roleDesc: { color: '#94a3b8', marginBottom: '20px' },
  roleDivider: { height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '20px' },
  roleList: { listStyle: 'none', padding: 0 },
  roleItem: { color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  checkIcon: { color: theme.accent, fontWeight: 'bold' },

  featureSection: { padding: '100px 0', background: 'linear-gradient(to bottom, #020617, #080d1a)' },
  featureGrid: { display: 'flex', alignItems: 'center', gap: '80px', flexWrap: 'wrap-reverse' },
  featureImageWrapper: { flex: '1', minWidth: '320px', position: 'relative' },
  featureImage: { width: '100%', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', zIndex: 2, position: 'relative' },
  glowEffect: { position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%', background: theme.accent, filter: 'blur(100px)', opacity: 0.1 },
  featureTextContent: { flex: '1.2', minWidth: '320px' },
  titleSmall: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '25px' },
  description: { fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.8', marginBottom: '35px' },
  statsContainer: { display: 'flex', gap: '40px' },
  statItem: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '2rem', fontWeight: '900', color: theme.accent },
  statLabel: { fontSize: '0.8rem', color: '#64748b' },

  sectionContact: { padding: '80px 0' },
  contactWrapper: { display: 'flex', gap: '60px', flexWrap: 'wrap' },
  contactInfo: { flex: '1', minWidth: '300px' },
  socialGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  socialLinkCard: { display: 'flex', alignItems: 'center', gap: '15px', background: '#0f172a', padding: '15px 25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' },
  policyCard: { flex: '1', minWidth: '300px', background: 'rgba(56, 189, 248, 0.03)', padding: '40px', borderRadius: '25px', border: `1px solid ${theme.accent}15` },
  policyText: { fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.8' },
  footer: { padding: '40px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }
};