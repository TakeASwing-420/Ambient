// This function generates a simple waveform visualization
export const renderWaveform = (container: HTMLElement) => {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 100 40');
  svg.setAttribute('preserveAspectRatio', 'none');
  
  // Create primary waveform path
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M0,20 Q5,5 10,20 T20,20 T30,20 T40,20 T50,20 T60,20 T70,20 T80,20 T90,20 T100,20');
  path1.setAttribute('fill', 'none');
  path1.setAttribute('stroke', '#8B5CF6');
  path1.setAttribute('stroke-width', '1.5');
  path1.setAttribute('vector-effect', 'non-scaling-stroke');
  
  // Create secondary waveform path
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M0,20 Q5,10 10,20 T20,20 T30,25 T40,15 T50,25 T60,18 T70,22 T80,16 T90,24 T100,20');
  path2.setAttribute('fill', 'none');
  path2.setAttribute('stroke', '#4F46E5');
  path2.setAttribute('stroke-width', '2');
  path2.setAttribute('vector-effect', 'non-scaling-stroke');
  
  // Append paths to SVG
  svg.appendChild(path1);
  svg.appendChild(path2);
  
  // Append SVG to container
  container.innerHTML = '';
  container.appendChild(svg);
};
