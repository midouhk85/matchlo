import { FullLoader } from '@/components/ui';

/**
 * Écran d'entrée : la redirection réelle est gérée par l'AuthGuard du layout
 * racine selon la session et le profil. On affiche un loader le temps de router.
 */
export default function Index() {
  return <FullLoader />;
}
