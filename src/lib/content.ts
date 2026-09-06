import { getCollection } from 'astro:content';
import projectRecords from '../data/projects.json';
export async function projectsInOrder() {
  const entries = await getCollection('projects');
  return projectRecords.map(record => entries.find(entry => entry.id === record.id)!);
}
export async function essaysNewestFirst() {
  return (await getCollection('essays')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}
