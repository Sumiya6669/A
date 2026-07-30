import React from 'react';
import Hero from '../components/sections/Hero';
import Manifesto from '../components/sections/Manifesto';
import SectionsGrid from '../components/sections/SectionsGrid';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <SectionsGrid />
    </>
  );
}
