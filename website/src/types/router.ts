export type AppPage =
  | 'home'
  | 'location'
  | 'vente'
  | 'showroom'
  | 'carnet-sante'
  | 'espace-client'
  | 'partenaires'
  | 'agence'
  | 'profile';

export interface RouteState {
  page: AppPage;
  vehicleId?: string;
  initialPlate?: string;
}
