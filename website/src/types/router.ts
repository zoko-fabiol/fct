export type AppPage =
  | 'home'
  | 'location'
  | 'vente'
  | 'showroom'
  | 'carnet-sante'
  | 'espace-client'
  | 'agence';

export interface RouteState {
  page: AppPage;
  vehicleId?: string;
  initialPlate?: string;
}
