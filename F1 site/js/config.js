export const CONFIG = {
  // Resolução interna baixa para estética 16-bit (o CSS estica para 960x540)
  WIDTH: 640,
  HEIGHT: 360,

  // Dimensões do mundo fictício
  SEGMENT_LENGTH: 200,
  ROAD_WIDTH: 2000,
  CAMERA_HEIGHT: 1000,
  CAMERA_DEPTH: 0.84,    // Define o campo de visão (FOV)
  DRAW_DISTANCE: 220,    // Quantos segmentos desenhar à frente

  // Física e dirigibilidade do carro
  MAX_SPEED: 14500,
  MAX_KMH: 360,
  ACCEL: 5800,
  BRAKING: -14000,
  DECEL: 4000,           // Desaceleração natural ao soltar o acelerador
  OFFROAD_DECEL: 9000,   // Desaceleração ao sair do asfalto (grama)
  OFFROAD_LIMIT: 4500,   // Velocidade máxima permitida na grama
  STEER_SPEED: 1.8,      // Sensibilidade da direção
  CENTRIFUGAL: 0.6,      // Força que joga o carro para fora nas curvas
  TOTAL_GEARS: 7
};