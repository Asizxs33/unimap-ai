import { Component } from 'react';

export default class SceneErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="scene-error" role="alert">
      <h2>Не удалось открыть 3D-карту</h2>
      <p>Графический движок браузера остановился. Попробуйте загрузить карту с меньшей детализацией.</p>
      <button onClick={() => { this.props.onLowQuality(); this.setState({ error: false }); }}>Повторить в лёгком режиме</button>
    </div>;
  }
}
