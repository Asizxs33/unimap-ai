/**
 * Коробка, заданная как в исходной сцене: центр по X/Z, основание по Y.
 * Так координаты из эвакуационной схемы переносятся один в один.
 */
export function Box({
  x, z, w, d, h, y = 0,
  color, shadow = true, material, children, ...rest
}) {
  return (
    <mesh
      position={[x, y + h / 2, z]}
      castShadow={shadow}
      receiveShadow={shadow}
      {...rest}
    >
      <boxGeometry args={[w, h, d]} />
      {children ?? <meshStandardMaterial color={color} roughness={0.85} {...material} />}
    </mesh>
  );
}

/** Плоская подпись на полу (текстура из canvas) */
export function TextPlane({ texture, x, y, z, w, h, ...rest }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent {...rest} />
    </mesh>
  );
}
