import { EffectComposer, N8AO, SMAA, Vignette, ToneMapping, Bloom } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Затенение в углах (N8AO) — то, чего не хватает больше всего: без него
 * стыки стен и пола не видны и объём читается как набор коробок.
 * Ночью добавляем свечение окон и вывески.
 *
 * Вынесено в отдельный файл и подключается через React.lazy() в
 * CampusScene: postprocessing — самый тяжёлый кусок сборки (~400 КБ
 * gzip). На «Лёгком» качестве (LEVELS.low.post === false) он вообще
 * не должен попадать в сеть — а при статическом импорте попадал бы,
 * даже если компонент сразу возвращает null.
 */
export default function PostFX({ level, night, interior = false }) {
  if (!level.post) return null;
  return (
    <EffectComposer enableNormalPass>
      <N8AO aoRadius={interior ? 0.45 : 2.6} distanceFalloff={interior ? 0.4 : 1.1} intensity={interior ? 1.35 : 2.2} color={interior ? '#26251f' : '#28324a'} />
      {night ? <Bloom intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
             : <Bloom intensity={0.12} luminanceThreshold={0.92} luminanceSmoothing={0.4} mipmapBlur />}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.32} darkness={interior ? 0.15 : night ? 0.55 : 0.4} />
      <SMAA />
    </EffectComposer>
  );
}
