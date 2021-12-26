type Callback = (from: number, to: number) => void;

/**
 * 
 * @param e drag event
 * @param to index of the container the cell was dragged to
 */
const onDropEvent = (e: React.DragEvent<HTMLDivElement>, to: number, callback: Callback) => {
  const from = parseInt(e.dataTransfer.getData('index'));
  callback(from, to);
}

/**
 * 
 * @param e drag event
 */
const onDragOverEvent = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
}

/**
 * 
 * @param e drag event
 * @param from index of the container the cell was dragged from
 */
const onDragStartEvent = (e: React.DragEvent<HTMLDivElement>, from: number) => {
  e.dataTransfer.setData('index', from.toString());
}

export {
  onDropEvent,
  onDragOverEvent,
  onDragStartEvent,
};
