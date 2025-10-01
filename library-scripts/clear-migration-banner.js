// Run this in your browser's console to manually clear the migration banner
// This will prevent the migration banner from showing up again

localStorage.setItem('migration-banner-shown', 'true');
console.log('Migration banner cleared. Refresh the page to see the change.');

// Optional: Also clear any remaining localStorage data if you want a fresh start
// Uncomment the lines below if you want to clear all explainer data:

/*
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key === 'explainer-profile' ||
    key === 'explainer-settings' ||
    key === 'current-book' ||
    key.startsWith('bookmark-')
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => localStorage.removeItem(key));
console.log('Cleared localStorage data:', keysToRemove);
*/
