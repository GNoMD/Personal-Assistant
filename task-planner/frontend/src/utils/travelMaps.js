/**
 * 景点地图跳转链接（无需 API Key）
 */

export function getSpotMapQuery(spot) {
  if (spot?.mapQuery) return spot.mapQuery;
  return [spot?.location || spot?.address || '', spot?.name || ''].filter(Boolean).join('');
}

export function getAmapUrl(spot) {
  const q = getSpotMapQuery(spot);
  if (typeof spot?.lng === 'number' && typeof spot?.lat === 'number') {
    const name = encodeURIComponent(spot.name || q);
    return `https://uri.amap.com/marker?position=${spot.lng},${spot.lat}&name=${name}&coordinate=gaode&callnative=1`;
  }
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&src=personal-assistant`;
}

export function getBaiduMapUrl(spot) {
  const q = getSpotMapQuery(spot);
  if (typeof spot?.lng === 'number' && typeof spot?.lat === 'number') {
    // 百度地图 marker（WGS84 坐标用 coord_type=wgs84）
    return `https://api.map.baidu.com/marker?location=${spot.lat},${spot.lng}&title=${encodeURIComponent(spot.name || '')}&content=${encodeURIComponent(spot.address || q)}&output=html&coord_type=wgs84&src=webapp`;
  }
  return `https://map.baidu.com/search?querytype=s&wd=${encodeURIComponent(q)}`;
}

export function getOsmUrl(spot) {
  if (typeof spot?.lng === 'number' && typeof spot?.lat === 'number') {
    return `https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lng}#map=16/${spot.lat}/${spot.lng}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(getSpotMapQuery(spot))}`;
}

export function getOsmEmbedUrl(spot) {
  if (typeof spot?.lng !== 'number' || typeof spot?.lat !== 'number') return '';
  const { lat, lng } = spot;
  const dLng = 0.03;
  const dLat = 0.02;
  const bbox = [
    lng - dLng,
    lat - dLat,
    lng + dLng,
    lat + dLat,
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

/** 导航到推荐停车场（有坐标用 marker，否则关键词搜索） */
export function getParkingAmapUrl(spot) {
  const parking = spot?.parking || {};
  const name = encodeURIComponent(parking.name || `${spot?.name || ''}停车场`);
  if (typeof parking.lng === 'number' && typeof parking.lat === 'number') {
    return `https://uri.amap.com/marker?position=${parking.lng},${parking.lat}&name=${name}&coordinate=gaode&callnative=1`;
  }
  const q = parking.mapQuery || `${getSpotMapQuery(spot)}停车场`;
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&src=personal-assistant`;
}

export function getParkingBaiduUrl(spot) {
  const parking = spot?.parking || {};
  if (typeof parking.lng === 'number' && typeof parking.lat === 'number') {
    return `https://api.map.baidu.com/marker?location=${parking.lat},${parking.lng}&title=${encodeURIComponent(parking.name || '停车场')}&content=${encodeURIComponent(parking.distanceText || '')}&output=html&coord_type=wgs84&src=webapp`;
  }
  const q = parking.mapQuery || `${getSpotMapQuery(spot)}停车场`;
  return `https://map.baidu.com/search?querytype=s&wd=${encodeURIComponent(q)}`;
}
