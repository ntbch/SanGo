// Import CSS của Leaflet tại đây để chỉ trang có bản đồ mới tải bundle style.
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

interface VenueMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
  /** Chiều cao khối bản đồ, mặc định 320px. */
  height?: number;
}

/** Pin màu thương hiệu — vẽ bằng divIcon để không phụ thuộc asset PNG của Leaflet. */
function brandPin(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: '<span style="display:block;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#16a34a;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

/** Bản đồ Leaflet nhúng với marker đúng toạ độ cụm sân. */
export default function VenueMap({ lat, lng, name, address, height = 320 }: VenueMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="size-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
        />
        <Marker position={[lat, lng]} icon={brandPin()}>
          <Popup>
            <strong>{name}</strong>
            <br />
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
