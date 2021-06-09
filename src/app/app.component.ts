import { HttpClient } from '@angular/common/http';
import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  @ViewChild(GoogleMap) googleMap!: GoogleMap;
  @ViewChildren(MapMarker) mapMarkers!: QueryList<MapMarker>;

  apiLoaded!: Observable<boolean>;
  constructor(private readonly httpClient: HttpClient) {}

  center!: google.maps.LatLng;
  zoom = 3;
  bounds!: google.maps.LatLngBounds;
  markerOptions!: google.maps.MarkerOptions;
  markerPositions: google.maps.LatLng[] = [];
  curvature = 0.5;


  ngOnInit() {
    this.apiLoaded = this.httpClient.jsonp('https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyDhRBnoRRWtyX3B10VESjgMHX_nuUUZWIM', 'callback')
      .pipe(
        map(() => {
          const pos1 = new google.maps.LatLng(23.634501, -102.552783);
          const pos2 = new google.maps.LatLng(17.987557, -92.929147);
          this.bounds = new google.maps.LatLngBounds();
          this.bounds.extend(pos1);
          this.bounds.extend(pos2);
          this.center = this.bounds.getCenter();

          this.markerOptions = {
            draggable: true
          };
          this.markerPositions = [pos1, pos2, pos1];

          setTimeout(() => {
              this.googleMap.fitBounds(this.bounds);
              this.updateCurveMarker();
              google.maps.event.addListener(this.googleMap.googleMap ?? {}, 'zoom_changed', this.updateCurveMarker.bind(this));
              google.maps.event.addListener(this.googleMap.googleMap ?? {}, 'projection_changed', this.updateCurveMarker.bind(this));
              google.maps.event.addListener(this.mapMarkers.get(0)?.marker ?? {}, 'position_changed', this.updateCurveMarker.bind(this));
              google.maps.event.addListener(this.mapMarkers.get(1)?.marker ?? {}, 'position_changed', this.updateCurveMarker.bind(this));
          },0);

          return true;
        }),
        catchError(() => of(false)),
      );
  }

  updateCurveMarker() {
      var pos1 = (this.mapMarkers.get(0) ?? {getPosition: ()=> new google.maps.LatLng(0,0)}).getPosition() ?? new google.maps.LatLng(0,0), // latlng
      pos2 = (this.mapMarkers.get(1)  ?? {getPosition: ()=> new google.maps.LatLng(0,0)}).getPosition() ?? new google.maps.LatLng(0,0),
      projection = (this.googleMap.googleMap?? {getProjection: () => null}).getProjection(),
      p1 = projection?.fromLatLngToPoint(pos1),
      p2 = projection?.fromLatLngToPoint(pos2);

    // Calculate the arc.
    // To simplify the math, these points are all relative to p1:
    var e = new google.maps.Point((p2?.x ?? 0) - (p1?.x ?? 0), (p2?.y ?? 0) - (p1?.y ?? 0)), // endpoint (p2 relative to p1)
      m = new google.maps.Point(e.x / 2, e.y / 2), // midpoint
      o = new google.maps.Point(e.y, -e.x), // orthogonal
      c = new google.maps.Point( // curve control point
        m.x + this.curvature * o.x,
        m.y + this.curvature * o.y);

    var pathDef = 'M 0,0 ' +
    'q ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y;

    var zoom = this.googleMap.getZoom(),
      scale = 1 / (Math.pow(2, -zoom));

    var symbol = {
      path: pathDef,
      scale: scale,
      strokeWeight: 5,
      fillColor: 'none'
    };

    (this.mapMarkers.get(2) ?? {marker: {setIcon: ()=> null}} ).marker?.setIcon(symbol);
    (this.mapMarkers.get(2)?? {marker: {setPosition: () => null}} ).marker?.setPosition(pos1);
  }
}
