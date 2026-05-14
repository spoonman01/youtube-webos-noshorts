function isObject(value) {
  return value != null && typeof value === 'object';
}

export const SHELF_SHORTS = 'TVHTML5_SHELF_RENDERER_TYPE_SHORTS';
export const SHORTS_BROWSE_IDS = new Set(['FEshorts']);
export const SHORTS_PIVOT_IDS = new Set(['FEshorts', 'SHORTS']);
export const TILE_RENDERER_KEYS = [
  'tileRenderer',
  'gridVideoRenderer',
  'videoRenderer',
  'compactVideoRenderer'
];

export function hasReelEndpoint(endpoint) {
  return isObject(endpoint) && isObject(endpoint.reelWatchEndpoint);
}

export function stringHasShort(value) {
  return typeof value === 'string' && value.toUpperCase().includes('SHORT');
}

export function aspectIsVertical(value) {
  if (typeof value === 'number') return value > 0 && value < 1;
  if (typeof value === 'string') return /VERTICAL|PORTRAIT/i.test(value);
  return false;
}

export function tileLooksLikeShort(tile) {
  if (!isObject(tile)) return false;

  if (
    hasReelEndpoint(tile.onSelectCommand) ||
    hasReelEndpoint(tile.navigationEndpoint)
  ) {
    return true;
  }

  if (
    stringHasShort(tile.style) ||
    stringHasShort(tile.contentType) ||
    stringHasShort(tile.tileStyle) ||
    stringHasShort(tile.thumbnailStyle) ||
    stringHasShort(tile.metadataStyle)
  ) {
    return true;
  }

  const thumbAR =
    tile.header?.tileHeaderRenderer?.thumbnail?.thumbnailRenderer
      ?.tileThumbnailRenderer?.aspectRatio ??
    tile.thumbnail?.thumbnailRenderer?.tileThumbnailRenderer?.aspectRatio ??
    tile.thumbnail?.aspectRatio;
  if (aspectIsVertical(thumbAR)) return true;

  const badges = tile.metadata?.tileMetadataRenderer?.badges ?? tile.badges;
  if (Array.isArray(badges)) {
    for (const badge of badges) {
      const label = badge?.metadataBadgeRenderer?.label ?? badge?.label;
      if (stringHasShort(label)) return true;
    }
  }

  return false;
}

export function isShortsNode(node) {
  if (!isObject(node)) return false;

  if (node.reelWatchEndpoint) return true;
  if (
    hasReelEndpoint(node.onSelectCommand) ||
    hasReelEndpoint(node.navigationEndpoint) ||
    hasReelEndpoint(node.endpoint)
  ) {
    return true;
  }

  const browseId =
    node.browseEndpoint?.browseId ??
    node.navigationEndpoint?.browseEndpoint?.browseId ??
    node.endpoint?.browseEndpoint?.browseId;
  if (typeof browseId === 'string' && SHORTS_BROWSE_IDS.has(browseId)) {
    return true;
  }

  for (const key of TILE_RENDERER_KEYS) {
    if (tileLooksLikeShort(node[key])) return true;
  }

  if (
    node.richItemRenderer?.content &&
    isShortsNode(node.richItemRenderer.content)
  ) {
    return true;
  }

  const shelf = node.shelfRenderer || node.richShelfRenderer;
  if (shelf?.tvhtml5ShelfRendererType === SHELF_SHORTS) return true;
  if (stringHasShort(shelf?.style)) return true;

  const pivot = node.pivotBarItemRenderer;
  if (pivot) {
    if (SHORTS_PIVOT_IDS.has(pivot.pivotIdentifier)) return true;
    if (
      SHORTS_BROWSE_IDS.has(pivot.navigationEndpoint?.browseEndpoint?.browseId)
    )
      return true;
  }

  const guide = node.guideEntryRenderer;
  if (
    SHORTS_BROWSE_IDS.has(guide?.navigationEndpoint?.browseEndpoint?.browseId)
  )
    return true;

  return false;
}

export function isShortsCommand(command) {
  if (!isObject(command)) return false;

  if (hasReelEndpoint(command)) return true;
  if (isShortsNode(command)) return true;

  for (const value of Object.values(command)) {
    if (isShortsNode(value)) return true;
  }

  return false;
}
