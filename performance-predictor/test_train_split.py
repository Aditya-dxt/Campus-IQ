def train_test_split(X, y, test_size=0.2, seed=42):
    m = X.shape[0]
    np.random.seed(seed)
    indices = np.random.permutation(m)
    
    test_count = int(np.floor(m * test_size))

    test_indices = indices[:test_count]  # first `test_count` entries of `indices`
    train_indices = indices[test_count:]  # the rest of `indices`

    X_train, X_test = X[train_indices], X[test_indices]
    y_train, y_test = y[train_indices], y[test_indices]
    
    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    import numpy as np

    X = np.arange(20).reshape(10, 2)  # 10 students, 2 features
    y = np.array([1,0,1,0,1,0,1,0,1,0])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    print("Train shape:", X_train.shape, "Test shape:", X_test.shape)
    print("y_train:", y_train)
    print("y_test:", y_test)