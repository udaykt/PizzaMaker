import styles from './about.module.css';

// The About page does two jobs, in this order:
//   1. Sell the idea (this is a pizzeria with one item on the menu — yours).
//   2. Tell the truth (it's a portfolio project, and here's what it demonstrates).
//
// The "Est. 1978" on the logo is a brand conceit, so it's owned with a wink
// rather than dressed up as history — anyone who reads this page should leave
// knowing exactly what this is and what was built.
const About = () => (
  <div className={styles.about}>
    <section className={styles.hero}>
      <span className={styles.est}>Est. 1978 — allegedly</span>
      {/* No period in this heading on purpose: it uses --font-brand (Ketchup
          Manis), whose demo cut is missing the full-stop glyph and renders it as
          tofu. Commas and apostrophes are fine, so the comma phrasing is safe. */}
      <h1 className={styles.title}>One item on the menu, and it's yours</h1>
      <p className={styles.lede}>
        Most pizza places sell you their idea of a pizza. This one only sells yours:
        pick a base, pile on what you like, watch it come together slice by slice,
        and walk away with something worth naming.
      </p>
    </section>

    <section className={styles.card}>
      <h2>Behind the build</h2>
      <p>
        Full disclosure: the 1978 is a joke, and the oven is a Spring Boot service.
        PizzaMaker is a portfolio project by <strong>Uday</strong> — a
        production-shaped, full-stack application that happens to make pizza. The
        pizza is the fun part. The engineering is the point.
      </p>
    </section>

    <section className={styles.card}>
      <h2>Under the hood</h2>
      <ul className={styles.list}>
        <li>
          <strong>What you build is what you get.</strong> The pizza is an SVG
          assembled live from your choices — and the same renderer draws your
          receipt and your order history, so nothing is ever a stock photo.
        </li>
        <li>
          <strong>Pizzas get names, not lists.</strong> Your toppings are read for
          their character and named accordingly — The Carnivore, Garden Party,
          Blazing Kitchen Sink. Don't like ours? Name it yourself.
        </li>
        <li>
          <strong>Orders can't get lost.</strong> Placing an order writes the order
          and its event in a single database transaction (a transactional outbox),
          so the kitchen can never start on an order that doesn't exist — or miss
          one that does.
        </li>
        <li>
          <strong>The kitchen is event-driven.</strong> Kafka carries each order
          through its lifecycle, and every status change is pushed straight to your
          browser over WebSockets. No refresh button anywhere.
        </li>
      </ul>
      <p className={styles.stack}>
        Java 21 · Spring Boot · PostgreSQL · Flyway · Kafka · WebSocket/STOMP ·
        React 18 · Vite · Docker · Kubernetes &amp; Helm
      </p>
    </section>
  </div>
);

export default About;
