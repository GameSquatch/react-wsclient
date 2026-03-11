import './MsgBox.css';

/**
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns
 */
const MsgBox = ({ children }) => {
  return <div className="msg-box">{children}</div>;
};

export default MsgBox;
