import React from 'react';
import styles from './about.module.css';

const About = () => {
  const about = 'Hi, I am Uday and I developed this application';
  return (
    <div className={styles.about}>
      <div className={styles.card}>
        <h2>About</h2>
        <p>{about}</p>
      </div>
    </div>
  );
};

export default About;
