/**
 * @deprecated 禁止再用模板胡编景点凑数量。
 * 景点只保留 landmarks-east/central/west 中可检索的真实地点。
 */
console.error('已停用：不要用 expand-city-landmarks 凑景点数量。');
console.error('请编辑 scripts/spot-seeds/landmarks-*.mjs 后执行: npm run spots:rich');
process.exit(1);
