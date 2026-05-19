import './styles.css';
import { renderAppShell } from './ui/renderAppShell';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root element');
}

renderAppShell(root);
