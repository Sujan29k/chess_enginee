"use client";

import Link from "next/link";
import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <div className={styles.logo}>♟️ CheckMates</div>
        <nav className={styles.navLinks}>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign Up</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Welcome to CheckMates</h1>
        <p className={styles.heroDescription}>
          Dive into the world of strategy and intellect. Play, learn, and master
          the art of chess with our interactive platform.
        </p>
        <Link href="/login" className={styles.heroButton}>
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Image
              src="/online.png"
              alt="Play Online"
              width={90}
              height={90}
            />
          </div>
          <h3 className={styles.featureTitle}>Play Online</h3>
          <p className={styles.featureDescription}>
            Challenge players from around the globe and improve your skills in
            real-time matches.
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Image
              src="/strategy.jpeg"
              alt="Learn Strategies"
              width={90}
              height={90}
            />
          </div>
          <h3 className={styles.featureTitle}>Learn Strategies</h3>
          <p className={styles.featureDescription}>
            Access tutorials and lessons to sharpen your chess strategies and
            tactics.
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Image
              src="/analysis.jpeg"
              alt="Analyze Games"
              width={90}
              height={90}
            />
          </div>
          <h3 className={styles.featureTitle}>Analyze Games</h3>
          <p className={styles.featureDescription}>
            Review your games and learn from your mistakes with our advanced
            analysis tools.
          </p>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to Play?</h2>
        <p className={styles.ctaDescription}>
          Join the community of chess enthusiasts and start your journey today.
        </p>
        <Link href="/signup" className={styles.ctaButton}>
          Sign Up Now
        </Link>
      </section>
    </main>
  );
}
