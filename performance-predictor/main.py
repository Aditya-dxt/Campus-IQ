import numpy as np
import pandas as pd
from test_train_split import train_test_split
from standardization import standardize
from train import train
from sigmoid import sigmoid
from log_loss import average_log_loss

df = pd.read_csv(r"C:\Users\DELL\Downloads\student_risk_data.csv")
X = df[['attendance_pct', 'submission_rate_pct', 'activity_log_count']].values
y = df['at_risk'].values 


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)


X_train_scaled, X_test_scaled = standardize(X_train, X_test)


weights = np.zeros(X_train_scaled.shape[1])
b = 0.0
final_weights, final_b = train(X_train_scaled, y_train, weights, b, alpha=0.1, epochs=1000)

z_test = X_test_scaled @ final_weights + final_b
y_hat_test = sigmoid(z_test)
test_loss = average_log_loss(y_test, y_hat_test)
print("Test Loss:", test_loss)

predictions = (y_hat_test >= 0.5).astype(int)
accuracy = (np.mean(predictions == y_test))*100
print("Test Accuracy:", accuracy)