
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <h1 className="error-title">页面迷路了</h1>
                <p className="error-desc">
                    看来你访问的页面已经去图书馆自习了...<br />
                    找不到这个页面，但你可以找到更多学习资料。
                </p>

                <div className="error-actions">
                    <Link to="/" className="btn btn-primary">
                        返回首页
                    </Link>
                    <Link to="/materials" className="btn btn-ghost">
                        发现资料
                    </Link>
                </div>

                <div className="floating-elements">
                    <span className="float-el el-1">?</span>
                    <span className="float-el el-2">404</span>
                    <span className="float-el el-3">📚</span>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
