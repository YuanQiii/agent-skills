import { readAllSkills } from '../core/skills.js';
import { loadTranslations } from '../infra/translator.js';
import { generateCatalog } from '../core/catalog.js';

const skills = readAllSkills();
const translations = loadTranslations();
generateCatalog(skills, translations);
