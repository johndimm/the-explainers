import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Read the ExplainerStylesPage component
const componentPath = join(process.cwd(), 'src', 'components', 'ExplainerStylesPage.tsx')
const componentContent = readFileSync(componentPath, 'utf8')

// Extract the STYLE_CATEGORIES object using regex
const categoriesMatch = componentContent.match(/export const STYLE_CATEGORIES = \{[\s\S]*?\} as const/)

if (!categoriesMatch) {
  console.error('Could not find STYLE_CATEGORIES in component file')
  process.exit(1)
}

// Extract just the categories part (without the export and as const)
const categoriesString = categoriesMatch[0]
  .replace('export const STYLE_CATEGORIES = ', '')
  .replace(' as const', '')

// Parse it as JavaScript to get the object
const categories = eval(`(${categoriesString})`)

// Convert to the format needed for the Wikipedia script
const convertedCategories: { [key: string]: { name: string, value: string }[] } = {}

for (const [categoryName, styles] of Object.entries(categories)) {
  convertedCategories[categoryName] = (styles as any[]).map(style => ({
    name: style.name,
    value: style.value
  }))
}

// Write to a JSON file
const outputPath = join(process.cwd(), 'src', 'data', 'style-categories.json')
writeFileSync(outputPath, JSON.stringify(convertedCategories, null, 2))

console.log('✅ Extracted style categories to src/data/style-categories.json')
console.log(`📊 Found ${Object.keys(convertedCategories).length} categories:`)
for (const [name, styles] of Object.entries(convertedCategories)) {
  console.log(`  ${name}: ${styles.length} styles`)
}
