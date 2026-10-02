import { NOVUS_POPULAR_PACKAGES, NOVUS_CURATED_PACKAGES, getAllNovusPackages } from './novusPackagesData';

const labPackages = NOVUS_POPULAR_PACKAGES.map((pkg) => ({
  id: pkg.id,
  name: pkg.name,
  code: pkg.code,
  brand: 'NOVUS HEALTH LABS',
  title: pkg.name,
  subtitle: pkg.category,
  tests: `${pkg.testsCount} Tests Included`,
  price: pkg.price,
  priceStr: pkg.priceStr,
  oldPrice: `₹${pkg.mrp}`,
  mrp: pkg.mrp,
  discount: pkg.discount,
  homeCollectionAvailable: pkg.homeCollectionAvailable,
  sampleType: pkg.sampleSummary,
  fastingRequired: pkg.preparationSummary.toLowerCase().includes('fasting'),
  fastingDetails: pkg.preparationSummary,
  reportTime: pkg.tatSummary,
  icon: 'fitness-outline',
  background: '#E8F8F5',
  parametersCount: pkg.testsCount,
  parametersList: pkg.tests.map((t) => `${t.name} (${t.parameters})`),
  clinicalNote: pkg.clinicalNote,
  category: pkg.category,
  categoryId: pkg.categoryId,
  testsList: pkg.tests,
}));

export { NOVUS_POPULAR_PACKAGES, NOVUS_CURATED_PACKAGES, getAllNovusPackages };
export default labPackages;